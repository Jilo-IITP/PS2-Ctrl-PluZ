"""
routers/auth.py
Auth routes: register, login, logout, /me
"""
from fastapi import APIRouter, Depends, status
from schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserOut
from controllers import auth_controller
from core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserOut)
async def register(body: RegisterRequest):
    result = await auth_controller.register_user(
        email=body.email,
        password=body.password,
        tpa_name=body.tpa_name,
        hospital_id=body.hospital_id,
    )
    return result


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    return await auth_controller.login_user(body.email, body.password)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user=Depends(get_current_user)):
    await auth_controller.logout_user(str(current_user.id))


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    return await auth_controller.get_profile(
        user_id=str(current_user.id),
        email=current_user.email,
    )
