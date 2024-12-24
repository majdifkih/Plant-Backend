import { Request, Response } from 'express';
import prisma from '../utils/db';

class PostController {
    async getAllPosts(req: Request, res: Response) {
        try {
            const posts = await prisma.post.findMany();
            res.json(posts);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch posts' });
        }
    }

    async getPostById(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const post = await prisma.post.findUnique({
                where: { id_post: Number(id) },
            });
            if (post) {
                res.json(post);
            } else {
                res.status(404).json({ error: 'Post not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch post' });
        }
    }

    async createPost(req: Request, res: Response) {
        const { titre, description, userId, plantId } = req.body;
        const photo = req.file ? req.file.filename : null;
        try {
            const newPost = await prisma.post.create({
                data: { titre, photo: photo || '', description, userId, plantId },
            });
            res.status(201).json(newPost);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create post' });
        }
    }

    async updatePost(req: Request, res: Response) {
        const { id } = req.params;
        const { titre, description, plantId } = req.body;
        const photo = req.file ? req.file.filename : null;
        try {
            const updatedPost = await prisma.post.update({
                where: { id_post: Number(id) },
                data: { titre, photo: photo || '', description, plantId },
            });
            res.json(updatedPost);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update post' });
        }
    }

    async deletePost(req: Request, res: Response) {
        const { id } = req.params;
        try {
            await prisma.post.delete({
                where: { id_post: Number(id) },
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete post' });
        }
    }

    async uploadPicture(req: Request, res: Response) {
        if (req.file) {
            res.json({ filename: req.file.filename });
        } else {
            res.status(400).json({ error: 'Failed to upload picture' });
        }
    }
}

export default new PostController();