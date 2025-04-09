export async function getImageHost() {
    return process.env.AUTH_URL || 'http://localhost:3000';
}
