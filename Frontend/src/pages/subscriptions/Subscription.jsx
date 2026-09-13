import React from 'react'
import {useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {useUser} from '../../context/UserContext'
import api from '../../api/axios'

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) {
        resolve(true);
        return;
    }

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true), {once: true});
        existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay Checkout.')), {once: true});
        return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Unable to load Razorpay Checkout.'));
    document.body.appendChild(script);
});

const delay = (milliseconds) => new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
});

export const Subscription = () => {
    const navigate = useNavigate();
    const {user} = useUser();
    const [subscription, setSubscription] = useState(null);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [checkoutPlanId, setCheckoutPlanId] = useState(null);
    const [activePlanName, setActivePlanName] = useState(null);

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const response = await api.get('/subscription/plans/');
                setSubscription(response.data.results);
            } catch (error) {
                setError('Unable to load subscription plans.');
                console.error('Error fetching subscription:', error);
            }
        };

        fetchSubscription();
    }, []);

    const waitForActivation = async (planName) => {
        for (let attempt = 0; attempt < 8; attempt += 1) {
            await delay(2500);

            try {
                const response = await api.get('/subscription/subscriptions/current/');
                if (response.data?.status === 'active') {
                    setActivePlanName(response.data.plan_name || planName);
                    setMessage('Payment confirmed. Your subscription is now active.');
                    navigate('/dashboard');
                    return;
                }
            } catch (pollError) {
                if (pollError.response?.status !== 404) {
                    throw pollError;
                }
            }
        }

        setMessage('Payment submitted. Activation is still being confirmed by Razorpay.');
    };

    const handlePlanSelection = async (plan) => {
        setCheckoutPlanId(plan.id);
        setError(null);
        setMessage(null);

        try {
            const response = await api.post('/subscription/subscriptions/upgrade/', {
                plan_id: plan.id,
            });

            if (plan.name === 'free') {
                setActivePlanName(response.data.subscription?.plan_name || plan.display_name);
                setMessage(`${plan.display_name} plan activated successfully.`);
                setCheckoutPlanId(null);
                navigate('/dashboard');
                return;
            }

            await loadRazorpay();

            const razorpay = new window.Razorpay({
                key: response.data.razorpay_key_id,
                subscription_id: response.data.razorpay_subscription_id,
                name: 'TaskFlow',
                description: `${plan.display_name} subscription`,
                prefill: {
                    name: user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.username || '',
                    email: user?.email || '',
                },
                notes: {
                    plan_id: String(plan.id),
                },
                theme: {
                    color: '#4f46e5',
                },
                handler: async () => {
                    setMessage('Payment submitted. Waiting for subscription confirmation...');
                    try {
                        await waitForActivation(plan.display_name);
                    } catch (pollError) {
                        setError('Payment was submitted, but subscription status could not be checked.');
                        console.error('Error checking subscription status:', pollError);
                    } finally {
                        setCheckoutPlanId(null);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setMessage('Checkout was closed. Your subscription was not changed.');
                        setCheckoutPlanId(null);
                    },
                },
            });

            razorpay.on('payment.failed', (paymentError) => {
                setError(paymentError.error?.description || 'Payment failed. Please try again.');
                setCheckoutPlanId(null);
            });
            razorpay.open();
        } catch (requestError) {
            setError(requestError.response?.data?.error || requestError.message || 'Unable to start checkout.');
            setCheckoutPlanId(null);
        }
    };

  return (
        <main className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Subscription Plans</h1>

            {error && <p className="text-red-600">{error}</p>}
            {message && <p className="mb-4 text-green-700">{message}</p>}
            {activePlanName && <p className="mb-4 font-medium text-gray-800">Current plan: {activePlanName}</p>}
            {!error && !subscription && <p className="text-gray-600">Loading plans...</p>}

            {subscription && (
                <ul className="space-y-6">
                    {subscription.map((plan) => {
                        const features = [
                            `Up to ${plan.max_users} users`,
                            `Up to ${plan.max_projects} projects`,
                            `Up to ${plan.max_tasks_per_month} tasks per month`,
                            `${plan.max_storage_mb} MB storage`,
                            plan.has_advanced_analytics && 'Advanced analytics',
                            plan.has_priority_support && 'Priority support',
                            plan.has_api_access && 'API access',
                            plan.has_custom_branding && 'Custom branding',
                            plan.has_sso && 'Single sign-on',
                        ].filter(Boolean);

                        return (
                            <li key={plan.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="text-2xl font-semibold text-gray-900">{plan.display_name}</h2>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    {Number(plan.price).toLocaleString('en-IN', {style: 'currency', currency: 'INR'})}
                                    <span className="text-base font-normal text-gray-600">/{plan.billing_period}</span>
                                </p>
                                <p className="mt-2 text-gray-600">{plan.description}</p>

                                <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
                                    {features.map((feature) => (
                                        <li key={feature}>{feature}</li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    onClick={() => handlePlanSelection(plan)}
                                    disabled={checkoutPlanId !== null || !plan.is_active}
                                    className="mt-6 w-full rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {checkoutPlanId === plan.id
                                        ? 'Starting checkout...'
                                        : plan.name === 'free'
                                            ? 'Choose free plan'
                                            : `Subscribe for ${Number(plan.price).toLocaleString('en-IN', {style: 'currency', currency: 'INR'})}`}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </main>
  )
}
