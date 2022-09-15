import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

from .genv_provisioner import set_indices

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": "This is /jupyterlab-genv/get_example endpoint!"
        }))

class SetIndicesHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        set_indices([1, 3, 5])
        self.finish(json.dumps({
            "data": f"This is /jupyterlab-genv/set_indices endpoint!"
        }))

def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    url = lambda uri: url_path_join(base_url, "jupyterlab-genv", uri)

    handlers = [
        (url("get_example"), RouteHandler),
        (url("set_indices"), SetIndicesHandler),
    ]

    web_app.add_handlers(host_pattern, handlers)
