import json
from typing import Any, AsyncGenerator

import config
import uvicorn
from api.challenges import ChallengesAPIHandler
from code_runner import run_single_test_case, test_code_against_all_cases
from fastapi import Body, FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from gemini_utils import (
    generate_code_logic,
    generate_hint_logic,
    generate_explanation_logic,
)
from starlette.responses import JSONResponse, StreamingResponse

app = FastAPI(title="Debug Master Backend", version="1.0.0")

# CORS (allow all origins for dev simplicity; tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


challenges_handler = ChallengesAPIHandler()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "OK"}


# ---------------
# Challenges APIs
# ---------------

@app.get("/api/challenges")
def get_challenges() -> JSONResponse:
    result = challenges_handler.handle_get_challenges("/api/challenges")
    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])  # type: ignore[arg-type]
    return JSONResponse(status_code=result["status"], content=result["data"])  # type: ignore[index]


@app.get("/api/challenges/{challenge_id}")
def get_challenge(
    challenge_id: str = Path(..., description="Challenge ID"),
) -> JSONResponse:
    path = f"/api/challenges/{challenge_id}"
    result = challenges_handler.handle_get_challenges(path)
    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])  # type: ignore[arg-type]
    return JSONResponse(status_code=result["status"], content=result["data"])  # type: ignore[index]


@app.post("/api/challenges")
def create_challenge(payload: dict[str, Any] = Body(...)) -> JSONResponse:
    result = challenges_handler.handle_post_challenge(payload)
    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])  # type: ignore[arg-type]
    return JSONResponse(status_code=result["status"], content=result["data"])  # type: ignore[index]


@app.put("/api/challenges/{challenge_id}")
def update_challenge(
    challenge_id: str = Path(..., description="Challenge ID"),
    payload: dict[str, Any] = Body(...),
) -> JSONResponse:
    result = challenges_handler.handle_put_challenge(challenge_id, payload)
    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])  # type: ignore[arg-type]
    return JSONResponse(status_code=result["status"], content=result["data"])  # type: ignore[index]


@app.delete("/api/challenges/{challenge_id}")
def delete_challenge(
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

    for i, test_case in enumerate(test_cases):
        result = run_single_test_case(code, test_case)
        payload: dict[str, Any] = {
            "status": "ok",
            "testCaseNumber": i + 1,
            **result,
        }
        yield _sse_format(payload)


@app.post("/api/run-python")
def run_python(payload: dict[str, Any] = Body(...)) -> StreamingResponse:
    code: str = payload.get("code", "")
    test_cases: list[dict[str, Any]] = payload.get("testCases", [])
    gen = _sse_generator(code, test_cases)
    return StreamingResponse(gen, media_type="text/event-stream")


@app.post("/api/generate-code")
def generate_code(payload: dict[str, Any] = Body(...)) -> JSONResponse:
    challenge: str = payload.get("challenge", "")
    test_cases: list[dict[str, Any]] = payload.get("testCases", [])
    prompt = f"Problem description:\n{challenge}\n"
    try:
        result = generate_code_logic(prompt, test_cases, test_code_against_all_cases)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/generate-hint")
def generate_hint(payload: dict[str, Any] = Body(...)) -> JSONResponse:
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
def generate_explanation(payload: dict[str, Any] = Body(...)) -> JSONResponse:
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


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=config.PORT, reload=True)
