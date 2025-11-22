import { prisma } from '../services/prisma.js';

const birdNames = [
    'bata', 'bundi', 'chiriku', 'chekechea', 'chopoa', 'domokijiko', 'fimbi', 'geuzamawe', 'goregore', 'jogoo',
    'kanga', 'kasuku', 'kisigajiru', 'kunguru', 'kware', 'kwechemraba', 'mbuni',
    'mwewe', 'tai', 'njiwa', 'tandawala', 'tausi', 'shorewanda', 'shorekishungi', 'yangeyange',
    'zuwarde', 'batamzinga', 'batamaji', 'shomoro', 'falkoni', 'pengwini'
];

export const generateUniqueName = async (baseName) => {
    let newName = baseName;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique) {
        const existingUser = await prisma.user.findFirst({
            where: { name: newName },
        });

        if (!existingUser) {
            isUnique = true;
        } else {
            const randomBird = birdNames[Math.floor(Math.random() * birdNames.length)];
            newName = `${baseName}-${randomBird}`;

            // If we've tried too many times with just one bird, add a number
            if (attempts > 5) {
                newName = `${baseName}-${randomBird}-${Math.floor(Math.random() * 1000)}`;
            }
            attempts++;
        }
    }

    return newName;
};
