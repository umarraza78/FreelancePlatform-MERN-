import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'client'
    });
    const [step, setStep] = useState(1);
    const [verificationCode, setVerificationCode] = useState('');
    const { register, verifyEmail, verifyPhone, error } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (step === 1) {
            if (formData.password !== formData.confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            const result = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                role: formData.role
            });

            if (result.success) {
                setStep(2);
            }
        } else if (step === 2) {
            const result = await verifyEmail(formData.emailVerificationToken);
            if (result.success) {
                setStep(3);
            }
        } else if (step === 3) {
            const result = await verifyPhone(verificationCode, formData.phone);
            if (result.success) {
                navigate('/dashboard');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    {step === 1 && (
                        <>
                            <div className="rounded-md shadow-sm -space-y-px">
                                <div>
                                    <label htmlFor="name" className="sr-only">Name</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Full Name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="sr-only">Email address</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Email address"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="sr-only">Phone Number</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Phone Number (optional)"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="sr-only">Password</label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Confirm Password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                                <select
                                    id="role"
                                    name="role"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    <option value="client">Client</option>
                                    <option value="freelancer">Freelancer</option>
                                </select>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                We've sent a verification email to {formData.email}. Please check your inbox and click the verification link.
                            </p>
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Continue to Phone Verification
                            </button>
                        </div>
                    )}

                    {step === 3 && formData.phone && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                We've sent a verification code to {formData.phone}. Please enter the code below.
                            </p>
                            <div>
                                <label htmlFor="verificationCode" className="sr-only">Verification Code</label>
                                <input
                                    id="verificationCode"
                                    name="verificationCode"
                                    type="text"
                                    required
                                    className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Enter verification code"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {step === 1 ? 'Register' : step === 2 ? 'Continue' : 'Verify Phone'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterForm; 