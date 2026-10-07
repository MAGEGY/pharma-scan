import { Router } from 'express';
import { UserReviewsService } from './userReviewsService';
import { authenticate } from "./authMiddleware";
import { 
  insertDrugReviewSchema,
  insertMedicalQuestionSchema,
  insertSupportTicketSchema,
  insertHelpRequestSchema
} from '../shared/schema';
import { z } from 'zod';
import { loggingService } from './loggingService';

const router = Router();
const userReviewsService = new UserReviewsService();

// Apply authentication middleware to all routes
router.use(authenticate);

// USER REVIEWS ROUTES

// Create a new drug review
router.post('/reviews', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = insertDrugReviewSchema.parse(req.body);
    const reviewData = {
      ...validatedData,
      userId,
    };

    const review = await userReviewsService.createReview(reviewData);
    res.status(201).json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    loggingService.error('Failed to create drug review', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Get drug reviews with filters
router.get('/reviews', async (req, res) => {
  try {
    const { userId, drugId, rating, limit, offset } = req.query;
    
    const filter = {
      userId: userId as string,
      drugId: drugId ? parseInt(drugId as string) : undefined,
      rating: rating ? parseInt(rating as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const reviews = await userReviewsService.getReviews(filter);
    res.json(reviews);
  } catch (error) {
    loggingService.error('Failed to get drug reviews', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Update a drug review
router.put('/reviews/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = insertDrugReviewSchema.partial().parse(req.body);
    const review = await userReviewsService.updateReview(reviewId, validatedData);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    loggingService.error('Failed to update drug review', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a drug review
router.delete('/reviews/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const success = await userReviewsService.deleteReview(reviewId, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    res.status(204).send();
  } catch (error) {
    loggingService.error('Failed to delete drug review', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Get user review statistics
router.get('/reviews/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;
    
    if (userId !== currentUserId) {
      return res.status(403).json({ error: 'Unauthorized to view these stats' });
    }

    const stats = await userReviewsService.getUserReviewStats(userId);
    res.json(stats);
  } catch (error) {
    loggingService.error('Failed to get user review stats', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get review stats' });
  }
});

// Q&A SYSTEM ROUTES

// Create a new medical question
router.post('/questions', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = insertMedicalQuestionSchema.parse(req.body);
    const questionData = {
      ...validatedData,
      userId,
      askedBy: req.user?.email || 'Anonymous',
    };

    const question = await userReviewsService.createQuestion(questionData);
    res.status(201).json(question);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    loggingService.error('Failed to create medical question', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Get medical questions with filters
router.get('/questions', async (req, res) => {
  try {
    const { userId, drugId, category, isAnswered, limit, offset } = req.query;
    
    const filter = {
      userId: userId as string,
      drugId: drugId ? parseInt(drugId as string) : undefined,
      category: category as string,
      isAnswered: isAnswered === 'true' ? true : isAnswered === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const questions = await userReviewsService.getQuestions(filter);
    res.json(questions);
  } catch (error) {
    loggingService.error('Failed to get medical questions', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

// Answer a medical question
router.post('/questions/:questionId/answer', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!answer || typeof answer !== 'string') {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const question = await userReviewsService.answerQuestion(questionId, answer, userId);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found or unauthorized' });
    }

    res.json(question);
  } catch (error) {
    loggingService.error('Failed to answer medical question', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

// Get unanswered questions
router.get('/questions/unanswered', async (req, res) => {
  try {
    const { userId, limit, offset } = req.query;
    
    const filter = {
      userId: userId as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const questions = await userReviewsService.getUnansweredQuestions(filter);
    res.json(questions);
  } catch (error) {
    loggingService.error('Failed to get unanswered questions', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get unanswered questions' });
  }
});

// Get popular questions
router.get('/questions/popular', async (req, res) => {
  try {
    const { limit } = req.query;
    const questions = await userReviewsService.getPopularQuestions(limit ? parseInt(limit as string) : undefined);
    res.json(questions);
  } catch (error) {
    loggingService.error('Failed to get popular questions', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get popular questions' });
  }
});

// CUSTOMER SUPPORT ROUTES

// Create a new support ticket
router.post('/support/tickets', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = insertSupportTicketSchema.parse(req.body);
    const ticketData = {
      ...validatedData,
      userId,
    };

    const ticket = await userReviewsService.createTicket(ticketData);
    res.status(201).json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    loggingService.error('Failed to create support ticket', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get support tickets with filters
router.get('/support/tickets', async (req, res) => {
  try {
    const { userId, status, priority, limit, offset } = req.query;
    
    const filter = {
      userId: userId as string,
      status: status as string,
      priority: priority as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const tickets = await userReviewsService.getTickets(filter);
    res.json(tickets);
  } catch (error) {
    loggingService.error('Failed to get support tickets', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

// Update a support ticket
router.put('/support/tickets/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = insertSupportTicketSchema.partial().parse(req.body);
    const ticket = await userReviewsService.updateTicket(ticketId, validatedData);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    loggingService.error('Failed to update support ticket', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Close a support ticket
router.post('/support/tickets/:ticketId/close', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const success = await userReviewsService.closeTicket(ticketId, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Ticket not found or unauthorized' });
    }

    res.json({ message: 'Ticket closed successfully' });
  } catch (error) {
    loggingService.error('Failed to close support ticket', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to close ticket' });
  }
});

// IN-APP HELP SYSTEM ROUTES

// Create a new help request
router.post('/help/requests', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validatedData = insertHelpRequestSchema.parse(req.body);
    const helpRequestData = {
      ...validatedData,
      userId,
    };

    const helpRequest = await userReviewsService.createHelpRequest(helpRequestData);
    res.status(201).json(helpRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    loggingService.error('Failed to create help request', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to create help request' });
  }
});

// Get help requests with filters
router.get('/help/requests', async (req, res) => {
  try {
    const { userId, category, status, priority, limit, offset } = req.query;
    
    const filter = {
      userId: userId as string,
      category: category as string,
      status: status as string,
      priority: priority as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const helpRequests = await userReviewsService.getHelpRequests(filter);
    res.json(helpRequests);
  } catch (error) {
    loggingService.error('Failed to get help requests', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get help requests' });
  }
});

// Respond to a help request
router.post('/help/requests/:requestId/respond', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { response } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!response || typeof response !== 'string') {
      return res.status(400).json({ error: 'Response is required' });
    }

    const success = await userReviewsService.respondToHelpRequest(requestId, response, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Help request not found or unauthorized' });
    }

    res.json({ message: 'Response sent successfully' });
  } catch (error) {
    loggingService.error('Failed to respond to help request', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to respond to help request' });
  }
});

// Get help suggestions
router.get('/help/suggestions', async (req, res) => {
  try {
    const { category, limit } = req.query;
    
    const filter = {
      category: category as string,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const suggestions = await userReviewsService.getHelpSuggestions(filter);
    res.json(suggestions);
  } catch (error) {
    loggingService.error('Failed to get help suggestions', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get help suggestions' });
  }
});

// ANALYTICS ROUTES

// Get review analytics
router.get('/analytics/reviews', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    
    const timeRange = {
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
    };

    const analytics = await userReviewsService.getReviewAnalytics(timeRange);
    res.json(analytics);
  } catch (error) {
    loggingService.error('Failed to get review analytics', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get review analytics' });
  }
});

// Get question analytics
router.get('/analytics/questions', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    
    const timeRange = {
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
    };

    const analytics = await userReviewsService.getQuestionAnalytics(timeRange);
    res.json(analytics);
  } catch (error) {
    loggingService.error('Failed to get question analytics', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get question analytics' });
  }
});

// Get ticket analytics
router.get('/analytics/tickets', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    
    const timeRange = {
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
    };

    const analytics = await userReviewsService.getTicketAnalytics(timeRange);
    res.json(analytics);
  } catch (error) {
    loggingService.error('Failed to get ticket analytics', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get ticket analytics' });
  }
});

// Get help analytics
router.get('/analytics/help', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    
    const timeRange = {
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
    };

    const analytics = await userReviewsService.getHelpAnalytics(timeRange);
    res.json(analytics);
  } catch (error) {
    loggingService.error('Failed to get help analytics', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get help analytics' });
  }
});

export default router;
