from typing import Dict, List

from . import control

async def _exec(command: str) -> str:
    return await control.exec(f'devices {command}')

async def ps() -> Dict:
    stdout = await _exec("ps --format csv --no-header --timestamp")
    lines = [line for line in stdout.splitlines() if len(line)]

    infos = []

    for line in lines:
        id, eid, env, attached = line.split(',')
        id = int(id)

        infos.append({
            "eid": eid,
            "env": env,
        })

    return infos

async def find(eid: str) -> List[int]:
    return [int(index) for index in (await _exec(f'find --eid {eid}')).split(',') if len(index) > 0]
