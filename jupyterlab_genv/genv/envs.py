from typing import Dict, List

from . import control

async def exec(command: str) -> str:
    return await control.exec(f'exec envs {command}')

async def ps() -> List[Dict]:
    stdout = await exec("ps --format csv --no-header --timestamp")
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
