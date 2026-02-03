export const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    return !!token;
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
};

export const getUser = () => {
    // You can store user info after login if needed
    const user = localStorage.getItem('user');
    console.log(user)
    return user ? JSON.parse(user) : null;
};
