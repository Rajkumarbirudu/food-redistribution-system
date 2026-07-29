from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    if not hashed_password:
        return False
    try:
        return password_hash.verify(
            plain_password,
            hashed_password,
        )
    except Exception:
        return plain_password == hashed_password