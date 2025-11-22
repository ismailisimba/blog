import { prisma } from '../services/prisma.js';
import { deleteFile as deleteFileFromGCS } from '../services/storage.js';

// Render the current user's profile page
export const renderProfile = async (req, res) => {
    try {
        const userWithFiles = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                uploadedFiles: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!userWithFiles) {
            return res.status(404).send('User not found.');
        }

        res.render('pages/profile', {
            user: userWithFiles,
            pageTitle: 'My Profile',
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.redirect('/');
    }
};

// Handle deletion of an uploaded file
export const deleteUploadedFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;

        const file = await prisma.uploadedFile.findUnique({
            where: { id: fileId },
        });

        if (!file || file.userId !== userId) {
            return res.status(403).send('Forbidden: You do not have permission to delete this file.');
        }

        await deleteFileFromGCS(file.fileName);
        await prisma.uploadedFile.delete({
            where: { id: fileId },
        });

        res.redirect('/profile');
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).send('Failed to delete file.');
    }
};

// --- ADMIN CONTROLLERS ---

// Render the user management page for admins
export const renderUserManagement = async (req, res) => {
    try {
        const allUsers = await prisma.user.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.render('pages/admin/users', {
            user: req.user,
            users: allUsers,
            pageTitle: 'User Management'
        });
    } catch (error) {
        console.error('Error fetching users for admin panel:', error);
        res.redirect('/');
    }
};

// Toggle a user's role between USER and MODERATOR
export const toggleModerator = async (req, res) => {
    try {
        const { userId } = req.params;

        const userToUpdate = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userToUpdate) {
            return res.status(404).send('User not found.');
        }

        if (userToUpdate.role === 'ADMIN') {
            return res.status(403).send('Cannot change the role of an Admin.');
        }

        const newRole = userToUpdate.role === 'USER' ? 'MODERATOR' : 'USER';

        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        });

        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error toggling moderator status:', error);
        res.redirect('/admin/users');
    }
};

// Toggle a user's banned status
export const toggleBan = async (req, res) => {
    try {
        const { userId } = req.params;

        const userToUpdate = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userToUpdate) {
            return res.status(404).send('User not found.');
        }

        if (userToUpdate.role === 'ADMIN') {
            return res.status(403).send('Cannot ban an Admin.');
        }

        const newBanStatus = !userToUpdate.isBanned;

        await prisma.user.update({
            where: { id: userId },
            data: { isBanned: newBanStatus }
        });

        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error toggling ban status:', error);
        res.redirect('/admin/users');
    }
};
