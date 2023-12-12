import { exec } from 'child_process';
import { promisify } from 'util';


const execAsync = promisify(exec);


async function getNodeProcessesCount(): Promise<number> {
    const { stdout } = await execAsync('ps -AL | grep node | wc -l');

    return parseInt(
        stdout.trim(),
        10
    );
}


async function getNetstatLines(): Promise<string[]> {
    const { stdout } = await execAsync('netstat -p | grep tcp | cat');

    return stdout.split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}


let lines = new Set<string>();

async function diff() {
    const [
        linesTmp, count,
    ] = await Promise.all([
        getNetstatLines(), getNodeProcessesCount(),
    ]);
    const
        linesAdded = new Set<string>(),
        linesRemoved = new Set<string>(lines);
    for (const line of linesTmp) {
        if (linesRemoved.has(line)) {
            linesRemoved.delete(line);
        } else {
            linesAdded.add(line);
        }
    }

    lines = new Set<string>(linesTmp);


    for (const line of Array.from(linesAdded)) {
        console.log(`+ ${line}`);
    }

    for (const line of Array.from(linesRemoved)) {
        console.log(`- ${line}`);
    }

    console.log(`Connections: ${lines.size} (+${linesAdded.size}/-${linesRemoved.size}) / Node processes: ${count}\n`);
}


setInterval(
    () => {
        diff()
            .catch((err) => {
                console.error(err);
            });
    },
    4 * 1000
);
