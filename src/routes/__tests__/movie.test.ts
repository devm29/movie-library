import request from 'supertest';
import express from 'express';
import movieRouter from '../movie';
import Movie from '../../models/movie';

jest.mock('../../models/movie');
jest.mock('../../middlewares/auth', () => ({
  __esModule: true,
  default: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as any).user = { _id: 'user-id' };
    next();
  },
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(movieRouter);
  return app;
};

describe('Movie routes', () => {
  const app = createApp();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /movies returns paginated movies for authenticated user', async () => {
    (Movie.find as unknown as jest.Mock).mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        { _id: '1', title: 'Movie 1', publishYear: 2020 },
      ]),
    });

    const response = await request(app)
      .get('/movies?page=1&pageSize=10')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body.movies).toHaveLength(1);
    expect(Movie.find).toHaveBeenCalledWith({ userId: 'user-id' });
  });

  test('GET /movies validates pagination parameters', async () => {
    const response = await request(app)
      .get('/movies?page=0&pageSize=10')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid pagination parameters');
  });

  test('GET /movies/:id returns 400 for invalid id format', async () => {
    const response = await request(app)
      .get('/movies/invalid-id')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid movie ID format');
  });
});

