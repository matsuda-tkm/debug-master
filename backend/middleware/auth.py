import base64
import binascii
import secrets
from typing import Literal, TypedDict

import config
from fastapi import Depends, HTTPException, Request, status


class AuthContext(TypedDict):
    role: Literal["user", "admin"]


def _unauthorized(detail: str = "Missing or invalid credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Basic"},
    )


def _credentials() -> list[tuple[str, str, Literal["user", "admin"]]]:
    creds: list[tuple[str, str, Literal["user", "admin"]]] = []
    if config.BASIC_AUTH_USER_ID and config.BASIC_AUTH_USER_PASSWORD:
        creds.append((config.BASIC_AUTH_USER_ID, config.BASIC_AUTH_USER_PASSWORD, "user"))
    if config.BASIC_AUTH_ADMIN_ID and config.BASIC_AUTH_ADMIN_PASSWORD:
        creds.append((config.BASIC_AUTH_ADMIN_ID, config.BASIC_AUTH_ADMIN_PASSWORD, "admin"))
    return creds


def verify_basic_auth(request: Request) -> AuthContext:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise _unauthorized()

    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() != "basic" or not token:
        raise _unauthorized()

    try:
        decoded = base64.b64decode(token, validate=True).decode("utf-8")
        username, password = decoded.split(":", 1)
    except (binascii.Error, UnicodeDecodeError, ValueError):
        raise _unauthorized("Invalid credentials")

    for expected_username, expected_password, role in _credentials():
        if secrets.compare_digest(username, expected_username) and secrets.compare_digest(
            password, expected_password
        ):
            return {"role": role}

    raise _unauthorized("Invalid credentials")


def require_admin(auth: AuthContext = Depends(verify_basic_auth)) -> AuthContext:
    if auth["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return auth
