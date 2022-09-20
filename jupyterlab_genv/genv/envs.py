import os
from typing import Dict, List

from . import control

async def _exec(command: str) -> str:
    return await control.exec(f'exec envs {command}')

async def activate(eid: str, kernel_id: str) -> None:
    await _exec(f'activate --eid {eid} --uid {os.getuid()} --kernel-id {kernel_id}')

async def find(kernel_id: str) -> str:
    return await _exec(f'find --kernel-id {kernel_id}')

async def ps() -> List[Dict]:
    stdout = await _exec("ps --format csv --no-header --timestamp")
    lines = [line for line in stdout.splitlines() if len(line)]

    infos = []

    for line in lines:
        eid, user, name, created, pids = line.split(',')

        infos.append({
            "eid": eid,
            "user": user,
            "name": name,
            "pids": [int(pid) for pid in pids.split(' ') if len(pid)],
        })

    return infos
