# Python API deployment

Tutorial from https://packaging.python.org/en/latest/tutorials/packaging-projects

## Set your environment file:

Edit `~/.pypirc` with the following content

```text
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
repository = https://upload.pypi.org/legacy/
username = __token__
password = <your token for PyPi>

[testpypi]
repository = https://test.pypi.org/legacy/
username = __token__
password = <your token for Test PyPi>
```

Note: keep `__token__` as username.


## Build

Use the correct virtual environment.

To build the package:

```shell
cd packages/python-api/src

python3 -m build --outdir ../../../dist/python-api
```

Package will be in `dist/python-api`:

```shell
cd ../../..
````

## Publish to repository

```shell
python3 -m twine upload --repository pypi dist/python-api/*
```
