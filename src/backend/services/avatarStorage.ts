import fs from 'fs/promises';
import path from 'path';

const avatarBaseDir = path.resolve(process.cwd(), 'storage', 'uploads', 'avatars');

const sanitize = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_');

export async function ensureAvatarStorage() {
    await fs.mkdir(avatarBaseDir, { recursive: true });
}

export async function saveAvatarFile(userId: string, file: Express.Multer.File): Promise<string> {
    await ensureAvatarStorage();
    const safeUserId = sanitize(userId);
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    const filename = `${safeUserId}${ext}`;
    const finalPath = path.join(avatarBaseDir, filename);
    await fs.copyFile(file.path, finalPath);
    await fs.unlink(file.path).catch(() => undefined);
    return `/uploads/avatars/${filename}`;
}

export function getAvatarAbsolutePath(relativeUrl: string): string {
    const relative = relativeUrl.replace(/^\/+/, '');
    return path.resolve(process.cwd(), 'storage', relative);
}
