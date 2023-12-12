import os
import requests

MASTER_PORT = os.getenv('MASTER_PORT')
proxies = {
    'http': 'http://fake:token@localhost:{}'.format(MASTER_PORT),
    'https': 'http://fake:token@localhost:{}'.format(MASTER_PORT)
}

# HTTP over HTTP
SERVERS_PORT_HTTP = os.getenv('SERVERS_PORT_HTTP')
r = requests.get('http://localhost:{}/file/big?size=1024'.format(SERVERS_PORT_HTTP), proxies=proxies)
if r.status_code != 200:
    raise Exception('cannot reach HTTP over HTTP')

# HTTPS over HTTP tunnel
SERVERS_PORT_HTTPS = os.getenv('SERVERS_PORT_HTTPS')
r = requests.get('https://localhost:{}/file/big?size=1024'.format(SERVERS_PORT_HTTPS), proxies=proxies, verify=False)
if r.status_code != 200:
    raise Exception('cannot reach HTTPS over HTTP tunnel')
