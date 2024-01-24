const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';


export function generateRandomString(length: number): string { // TODO: can be mutualized

    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
        result += CHARACTERS.charAt(randomIndex);
    }

    return result;
}
