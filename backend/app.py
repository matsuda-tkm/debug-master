import json
from pprint import pformat
from typing import Any, AsyncGenerator

import config
import uvicorn
from api.challenges import ChallengesAPIHandler
from code_runner import run_all_test_cases, test_code_against_all_cases
from fastapi import Body, Depends, FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from gemini_utils import (
    generate_code_logic,
    generate_hint_logic,
    generate_explanation_logic,
    generate_retire_explanation_logic,
)
from middleware.auth import AuthContext, require_admin, verify_basic_auth
from starlette.responses import JSONResponse, StreamingResponse
from database.challenge_repository import build_challenge_repository

app = FastAPI(title="Debug Master Backend", version="1.0.0")

assert config.ALLOWED_ORIGIN is not None, "ALLOWED_ORIGIN must be set in environment variables"

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


challenges_handler = ChallengesAPIHandler(build_challenge_repository())


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "OK"}


@app.get("/api/auth/me")
def auth_me(auth: AuthContext = Depends(verify_basic_auth)) -> dict[str, str]:
    return {"role": auth["role"]}


# ---------------
# Challenges APIs
# ---------------

@app.get("/api/challenges")
def get_challenges(_auth: AuthContext = Depends(verify_basic_auth)) -> JSONResponse:
    result = challenges_handler.handle_get_challenges("/api/challenges")
    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])  # type: ignore[arg-type]
    return JSONResponse(status_code=result["status"], content=result["data"])  # type: ignore[index]


@app.get("/api/challenges/{challenge_id}")
def get_challenge(
    _auth: AuthContext = Depends(verify_basic_auth),
    challenge_id: str = Path(..., description="Challenge ID"),
) -> JSONResponse:
    path = f"/api/challenges/{challenge_id}"
    result = challenges_handler.handle_get_challenges(path)
    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])  # type: ignore[arg-type]
    return JSONResponse(status_code=result["status"], content=result["data"])  # type: ignore[index]


@app.post("/api/challenges")
def create_challenge(
    _auth: AuthContext = Depends(require_admin),
    payload: dict[str, Any] = Body(...),
) -> JSONResponse:
    result = challenges_handler.handle_post_challenge(payload)
    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])  # type: ignore[arg-type]
    return JSONResponse(status_code=result["status"], content=result["data"])  # type: ignore[index]


@app.put("/api/challenges/{challenge_id}")
def update_challenge(
    _auth: AuthContext = Depends(require_admin),
    challenge_id: str = Path(..., description="Challenge ID"),
    payload: dict[str, Any] = Body(...),
) -> JSONResponse:
    result = challenges_handler.handle_put_challenge(challenge_id, payload)
    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])  # type: ignore[arg-type]
    return JSONResponse(status_code=result["status"], content=result["data"])  # type: ignore[index]


@app.delete("/api/challenges/{challenge_id}")
def delete_challenge(
    _auth: AuthContext = Depends(require_admin),
    challenge_id: str = Path(..., description="Challenge ID"),
) -> JSONResponse:
    result = challenges_handler.handle_delete_challenge(challenge_id)
    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])  # type: ignore[arg-type]
    return JSONResponse(status_code=result["status"], content={"message": result["message"]})  # type: ignore[index]


# ---------------
# Code runner APIs
# ---------------


def _sse_format(data: dict[str, Any]) -> bytes:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")


async def _sse_generator(code: str, test_cases: list[dict[str, Any]]) -> AsyncGenerator[bytes, None]:
    if "GEMINI_API_KEY" in code:
        yield _sse_format(
            {
                "status": "forbidden",
                "message": "Execution halted: Code contains forbidden string 'GEMINI_API_KEY'.",
            }
        )
        return

    results = run_all_test_cases(code, test_cases)
    for idx, result in enumerate(results, start=1):
        payload: dict[str, Any] = {
            "testCase": idx,
            **result,
        }
        yield _sse_format(payload)


@app.post("/api/run-python")
def run_python(
    _auth: AuthContext = Depends(verify_basic_auth),
    payload: dict[str, Any] = Body(...),
) -> StreamingResponse:
    code: str = payload.get("code", "")
    test_cases: list[dict[str, Any]] = payload.get("testCases", [])
    gen = _sse_generator(code, test_cases)
    return StreamingResponse(gen, media_type="text/event-stream")


@app.post("/api/generate-code")
def generate_code(
    _auth: AuthContext = Depends(verify_basic_auth),
    payload: dict[str, Any] = Body(...),
) -> JSONResponse:
    challenge: str = payload.get("challenge", "")
    test_cases: list[dict[str, Any]] = payload.get("testCases", [])
    test_case_inputs = [test_case.get("input") for test_case in test_cases]
    test_case_inputs_text = pformat(test_case_inputs, width=80)
    prompt = (
        f"Problem description:\n{challenge}\n\n"
        f"Test case inputs:\n{test_case_inputs_text}\n\n"
        "Output format rules:\n"
        "- Always include the following template at the beginning of the code:\n"
        "  ##### 編集禁止 ######\n"
        "  test_cases = [test case inputs]\n"
        "  \n"
        "  for i, input_value in enumerate(test_cases, start=1):\n"
        "      print(f\"---- テストケース{{i}} ----\")\n"
        "  ##### 編集禁止 ######\n"
        "      #### ここから編集\n"
        "      pass\n"
        "  \n"
        "- Always output '---- テストケース{i} ----' immediately before each test case output (i is a sequential number starting from 1).\n"
        "- Grading assumes that standard output includes this line as a delimiter for test cases.\n"
        "- If the delimiter cannot be detected, it will result in an error.\n"
        "- Do not define a main function; embed the test case inputs in the code and process them in order.\n"
        "- Treat each test case input as a single value, and pass it as an argument if necessary.\n"
    )
    try:
        result = generate_code_logic(prompt, test_cases, test_code_against_all_cases)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/generate-hint")
def generate_hint(
    _auth: AuthContext = Depends(verify_basic_auth),
    payload: dict[str, Any] = Body(...),
) -> JSONResponse:
    code: str = payload.get("code", "")
    instructions: str = payload.get("instructions", "")
    examples: str = payload.get("examples", "")
    test_results: list[dict[str, Any]] = payload.get("testResults", [])

    try:
        hints = generate_hint_logic(code, instructions, examples, test_results)
    except Exception as exc:  # pragma: no cover - defensive handling
        raise HTTPException(status_code=500, detail=f"Failed to generate hints: {exc}")

    return JSONResponse(content={"hints": hints})


@app.post("/api/generate-explanation")
def generate_explanation(
    _auth: AuthContext = Depends(verify_basic_auth),
    payload: dict[str, Any] = Body(...),
) -> JSONResponse:
    before_code: str = payload.get("beforeCode", "")
    after_code: str = payload.get("afterCode", "")
    instructions: str = payload.get("instructions", "")
    examples: str = payload.get("examples", "")
    test_results: list[dict[str, Any]] = payload.get("testResults", [])
    try:
        explanation = generate_explanation_logic(
            before_code, after_code, instructions, examples, test_results
        )
        return JSONResponse(content=explanation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/generate-retire-explanation")
def generate_retire_explanation(
    _auth: AuthContext = Depends(verify_basic_auth),
    payload: dict[str, Any] = Body(...),
) -> JSONResponse:
    before_code: str = payload.get("beforeCode", "")
    after_code: str = payload.get("afterCode", "")
    instructions: str = payload.get("instructions", "")
    examples: str = payload.get("examples", "")
    test_results: list[dict[str, Any]] = payload.get("testResults", [])
    try:
        explanation = generate_retire_explanation_logic(
            before_code, after_code, instructions, examples, test_results
        )
        return JSONResponse(content=explanation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=config.PORT, reload=True)
