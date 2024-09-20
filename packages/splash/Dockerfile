FROM scrapinghub/splash:3.5.0

COPY packages/splash/src/splash/network_manager.py /app/splash/network_manager.py

VOLUME [ \
    "/etc/splash/proxy-profiles", \
    "/etc/splash/js-profiles", \
    "/etc/splash/filters", \
    "/etc/splash/lua_modules" \
]

EXPOSE 8050

ENTRYPOINT [ \
    "python3", \
    "/app/bin/splash", \
    "--disable-browser-caches", \
    "--proxy-profiles-path", "/etc/splash/proxy-profiles", \
    "--js-profiles-path", "/etc/splash/js-profiles", \
    "--filters-path", "/etc/splash/filters", \
    "--lua-package-path", "/etc/splash/lua_modules/?.lua" \
]
