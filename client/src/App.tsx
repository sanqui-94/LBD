import { EnhancedAuthProvider } from './store/EnhancedAuthContext';
import './App.css';
import {AuthContainer} from "./components/auth/AuthContainer.tsx";

function App() {
    return (
        <EnhancedAuthProvider>
            <div className="App">
                <AuthContainer />
            </div>
        </EnhancedAuthProvider>
    );
}

export default App;
