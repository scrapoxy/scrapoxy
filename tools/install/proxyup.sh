#!/bin/sh

USER="root"
APP_DIR="/root"
NODE_APP="proxy.js"
KWARGS=""
PID_DIR="$APP_DIR/pid"
PID_FILE="$PID_DIR/app.pid"
LOG_DIR="$APP_DIR/log"
LOG_FILE="$LOG_DIR/app.log"
NODE_EXEC=$(which node)
APP_NAME="Scrapoxy"

###############

# REDHAT chkconfig header

# chkconfig: - 58 74
# description: node-app is the script for starting a node app on boot.
### BEGIN INIT INFO
# Provides: node
# Required-Start:    $network $remote_fs $local_fs
# Required-Stop:     $network $remote_fs $local_fs
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: start and stop node
# Description: Node process for app
### END INIT INFO

###############

USAGE="Usage: $0 {start|stop|restart|status} [--force]"
FORCE_OP=false

pid_file_exists() {
    [ -f "$PID_FILE" ]
}

get_pid() {
    echo "$(cat "$PID_FILE")"
}

is_running() {
    PID=$(get_pid)
    ! [ -z "$(ps aux | awk '{print $2}' | grep "^$PID$")" ]
}

start_it() {
    mkdir -p "$PID_DIR"
    chown $USER:$USER "$PID_DIR"
    mkdir -p "$LOG_DIR"
    chown $USER:$USER "$LOG_DIR"

    echo "Starting $APP_NAME ..."
    echo "cd $APP_DIR && $NODE_EXEC $APP_DIR/$NODE_APP $KWARGS 1>$LOG_FILE 2>&1 & echo \$! > $PID_FILE" | sudo -i -u $USER
    echo "$APP_NAME started with pid $(get_pid)"
}

stop_process() {
    PID=$(get_pid)
    echo "Killing process $PID"
    pkill -P $PID
}

remove_pid_file() {
    echo "Removing pid file"
    rm -f "$PID_FILE"
}

start_app() {
    if pid_file_exists
    then
        if is_running
        then
            PID=$(get_pid)
            echo "$APP_NAME already running with pid $PID"
            exit 1
        else
            echo "$APP_NAME stopped, but pid file exists"
            if [ $FORCE_OP = true ]
            then
                echo "Forcing start anyways"
                remove_pid_file
                start_it
            fi
        fi
    else
        start_it
    fi
}

stop_app() {
    if pid_file_exists
    then
        if is_running
        then
            echo "Stopping $APP_NAME ..."
            stop_process
            remove_pid_file
            echo "$APP_NAME stopped"
        else
            echo "$APP_NAME already stopped, but pid file exists"
            if [ $FORCE_OP = true ]
            then
                echo "Forcing stop anyways ..."
                remove_pid_file
                echo "$APP_NAME stopped"
            else
                exit 1
            fi
        fi
    else
        echo "$APP_NAME already stopped, pid file does not exist"
        exit 1
    fi
}

status_app() {
    if pid_file_exists
    then
        if is_running
        then
            PID=$(get_pid)
            echo "$APP_NAME running with pid $PID"
        else
            echo "$APP_NAME stopped, but pid file exists"
        fi
    else
        echo "$APP_NAME stopped"
    fi
}

case "$2" in
    --force)
        FORCE_OP=true
    ;;

    "")
    ;;

    *)
        echo $USAGE
        exit 1
    ;;
esac

case "$1" in
    start)
        start_app
    ;;

    stop)
        stop_app
    ;;

    restart)
        stop_app
        start_app
    ;;

    status)
        status_app
    ;;

    *)
        echo $USAGE
        exit 1
    ;;
esac