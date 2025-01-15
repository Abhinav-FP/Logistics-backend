import { createContext, useState } from "react";

export const authContext = createContext();

const AuthContextProvider = ({ children }) => {

    const [authUser, setAuthUser] = useState(localStorage.getItem('chat-user' || null))

    return(
        <authContext.Provider value={{ authUser, setAuthUser }}>
            {children}
        </authContext.Provider>
    )
}

export default AuthContextProvider;