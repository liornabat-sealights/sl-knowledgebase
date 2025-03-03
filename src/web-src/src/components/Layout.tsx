import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';

const Layout: React.FC = () => {
    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;