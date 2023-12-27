# Questions & Answers

## I've got an error `no such file or directory, open 'scrapoxy.json'` at startup

This is a standard warning that occurs during the initial launchof Scrapoxy
when the configuration file has not been created yet.

Subsequently, you may encounter the following error:

```shell
Cannot read store: ENOENT: no such file or directory, open 'scrapoxy.json' 
```


## At login, I've got the error `JwtInvalidError: JWT is invalid: JWT missing`

This error can occur for the following reasons:

1. Incorrect login/password;
2. When returning to the UI with outdated cookies, requiring a re-login;
3. If Scrapoxy is hosted on HTTP but the `FRONTEND_SECURE_COOKIE` environment variable is set to 1.
