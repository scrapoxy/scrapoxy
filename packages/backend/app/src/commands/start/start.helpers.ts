export function getEnvCommanderPort(): number {
    return parseInt(
        process.env.COMMANDER_PORT ?? '8890',
        10
    );
}
