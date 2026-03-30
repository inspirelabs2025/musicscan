import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

export { router };

export const MainRouter = () => <RouterProvider router={router} />;
