import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

from . import genv

class DevicesHandler(APIHandler):
    @tornado.web.authenticated
    async def get(self):
        self.finish(json.dumps(await genv.devices.ps()))

class EnvsHandler(APIHandler):
    @tornado.web.authenticated
    async def get(self):
        self.finish(json.dumps(await genv.envs.ps()))

def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    url = lambda uri: url_path_join(base_url, "jupyterlab-genv", uri)

    handlers = [
        (url("devices"), DevicesHandler),
        (url("envs"), EnvsHandler),
    ]

    web_app.add_handlers(host_pattern, handlers)
