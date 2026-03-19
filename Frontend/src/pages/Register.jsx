import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
        role: 'employee',
    });
    const [avatar, setAvatar] = useState(null); // ✅ Separate state for avatar file
    const [avatarPreview, setAvatarPreview] = useState(null); // ✅ Preview image
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // ✅ Handle file input separately
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size should be less than 5MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please upload an image file');
                return;
            }

            setAvatar(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
            
            // Clear any previous error
            setError('');
        }
    };

    // ✅ Remove selected image
    const removeAvatar = () => {
        setAvatar(null);
        setAvatarPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.password2) {
            setError("Passwords don't match");
            return;
        }

        // Validate password strength (optional)
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);

        try {
            // ✅ Create FormData for file upload
            const submitData = new FormData();
            submitData.append('username', formData.username);
            submitData.append('email', formData.email);
            submitData.append('password', formData.password);
            submitData.append('password2', formData.password2);
            submitData.append('first_name', formData.first_name);
            submitData.append('last_name', formData.last_name);
            submitData.append('role', formData.role);
            
            // ✅ Add avatar if selected
            if (avatar) {
                submitData.append('avatar', avatar);
            }

            // ✅ Send with multipart/form-data headers
            await api.post('/auth/register/', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            console.error('Registration error:', err);
            
            // Better error handling
            let errorMessage = 'Registration failed';
            
            if (err.response?.data) {
                const errorData = err.response.data;
                
                // Handle different error formats
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.username) {
                    errorMessage = Array.isArray(errorData.username) 
                        ? errorData.username[0] 
                        : errorData.username;
                } else if (errorData.email) {
                    errorMessage = Array.isArray(errorData.email) 
                        ? errorData.email[0] 
                        : errorData.email;
                } else if (errorData.password) {
                    errorMessage = Array.isArray(errorData.password) 
                        ? errorData.password[0] 
                        : errorData.password;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                }
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 p-4">
            <div className="absolute inset-0 bg-black opacity-20"></div>

            <div className="relative z-10 bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-2xl backdrop-blur-sm bg-opacity-95">
                <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                        </svg>
                    </div>
                </div>

                <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Create Account
                </h2>
                <p className="text-center text-gray-600 mb-6">Join us and start managing your tasks</p>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ✅ Avatar Upload Section */}
                    <div className="flex flex-col items-center mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Profile Picture (Optional)
                        </label>
                        
                        {avatarPreview ? (
                            <div className="relative">
                                <img 
                                    src={avatarPreview} 
                                    alt="Avatar preview" 
                                    className="w-24 h-24 rounded-full object-cover border-4 border-purple-500 shadow-lg"
                                />
                                <button
                                    type="button"
                                    onClick={removeAvatar}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-2">
                                {formData.first_name?.[0] || formData.username?.[0] || '?'}
                            </div>
                        )}
                        
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="avatar-upload"
                        />
                        <label
                            htmlFor="avatar-upload"
                            className="mt-3 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition cursor-pointer text-sm font-medium"
                        >
                            {avatar ? 'Change Photo' : 'Upload Photo'}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Max 5MB (JPG, PNG, GIF)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="Choose a username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="First name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="Last name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Role
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white"
                        >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="Create password"
                                required
                                minLength={6}
                            />
                            <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                name="password2"
                                value={formData.password2}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="Confirm password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-[1.02] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-6"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating account...
                            </span>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold hover:underline">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;