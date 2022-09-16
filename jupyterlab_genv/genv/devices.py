from typing import List

from . import control

async def exec(command: str) -> str:
    return await control.exec(f'exec devices {command}')

async def query(eid: str) -> List[int]:
    return [int(index) for index in (await exec(f'query --eid {eid}')).split(',') if len(index) > 0]
