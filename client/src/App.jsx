import { Children, useContext, useEffect } from 'react';
import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { authContext } from './context/AuthContext';
import { Dashboard, Layout, Login, Profile, Settings, Error } from './pages/Dashboard/Index';


function App() {

  const { authUser } = useContext(authContext);
  useEffect(() => {
    console.log('authUser: ', authUser);
  })

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout /> ,
      children: [
        {
          index: true,
          element: authUser ? <Dashboard /> : <Login />
        },
        {
          path: 'login',
          element: authUser ? <Dashboard /> : <Login />
        },
        {
          path: 'profile',
          element: authUser ? <Profile /> : <Login />
        },
        {
          path: 'settings',
          element: authUser ? <Settings />  : <Login />
        },
        {
          path: '*',
          element: <Error /> 
        }
      ]
    }
  ])

  return (
    <>
        <RouterProvider router={router} />
    </>
  )
}

export default App
