import React from 'react';
import './App.css';
import CheckSlipForm from './components/CheckSlipForm';

const App: React.FC = () => {
    return (
        <div className="App">
            <header className="App-header">
                <CheckSlipForm />
            </header>
        </div>
    );
};

export default App;
