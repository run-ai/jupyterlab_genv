import asyncio

async def exec(command: str) -> str:
    proc = await asyncio.create_subprocess_shell(f'genv {command}',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE)

    stdout, stderr = await proc.communicate()

    assert proc.returncode == 0

    return stdout.decode('utf-8').strip()
