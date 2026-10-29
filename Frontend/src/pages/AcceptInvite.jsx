import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, CircleCheck, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import api from '../api/axios';
import './AcceptInvite.css';

const fields = [
    { name: 'first_name', label: 'First name', autoComplete: 'given-name', placeholder: 'First name' },
    { name: 'last_name', label: 'Last name', autoComplete: 'family-name', placeholder: 'Last name' },
    { name: 'username', label: 'Username', autoComplete: 'username', placeholder: 'Choose a username', required: true },
    { name: 'password', label: 'Password', autoComplete: 'new-password', placeholder: 'Create a password', required: true },
    { name: 'password2', label: 'Confirm password', autoComplete: 'new-password', placeholder: 'Re-enter your password', required: true },
];

export const AcceptInvite = () => {
    const { token } = useParams();
    console.log('Invitation token:', token);
    const navigate = useNavigate();
    const formRef = useRef(null);
    const [formData, setFormData] = useState({
        username: '', password: '', password2: '', first_name: '', last_name: '',
    });
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
        setErrors((previous) => ({
            ...previous, [name]: '', ...(name === 'password' ? { password2: '' } : {}),
        }));
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (loading) return;
        setErrors({});
        setError('');
        if (!token) {
            setError('This invitation link is incomplete. Ask your workspace admin for a new invitation.');
            return;
        }
        if (formData.password !== formData.password2) {
            setErrors({ password2: 'Your passwords don’t match. Please try again.' });
            formRef.current.elements.password2.focus();
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/accept-invitation/', { ...formData, token });
            navigate('/login');
        } catch (err) {
            const data = err.response?.data;
            const fieldErrors = {};
            for (const { name } of fields) {
                const message = data?.[name];
                if (message) fieldErrors[name] = Array.isArray(message) ? message.join(' ') : String(message);
            }
            setErrors(fieldErrors);
            if (data?.token) {
                setError('This invitation is invalid or has expired. Ask your workspace admin for a new invitation.');
            } else if (Object.keys(fieldErrors).length) {
                formRef.current.elements[Object.keys(fieldErrors)[0]]?.focus();
            } else {
                const message = data?.detail || data?.non_field_errors || data?.error;
                setError(
                    Array.isArray(message) ? message.join(' ') :
                        typeof message === 'string' ? message :
                            'We couldn’t create your account. Please try again in a moment.',
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="accept-invite">
            <aside className="invite-welcome" aria-label="Welcome to Prodly">
                <Link to="/" className="invite-brand" aria-label="Prodly home">
                    <CircleCheck size={30} strokeWidth={2.3} aria-hidden="true" />
                    <span>Prodly<span className="invite-brand-period">.</span></span>
                </Link>
                <div className="invite-welcome-content">
                    <h2>Good work starts<br />with a great team.</h2>
                    <p>A shared space for your projects, your tasks,<br className="invite-desktop-break" /> and the people who make them happen.</p>
                    <div className="invite-letter" aria-hidden="true">
                        <div className="invite-envelope-back" />
                        <div className="invite-paper">
                            <CircleCheck size={28} strokeWidth={1.8} />
                            <span className="invite-paper-title">There’s a place<br />for you here.</span>
                            <span className="invite-paper-note">Let’s build something together.</span>
                            <div className="invite-paper-signature">Your team at Prodly</div>
                        </div>
                        <svg className="invite-envelope-front" viewBox="0 0 360 210" fill="none">
                            <path d="M1 1L180 106L359 1V194C359 202 353 209 344 209H16C8 209 1 202 1 194V1Z" fill="#DDD5F4" />
                            <path d="M1 1L180 106L359 1M1 209L126 117M359 209L234 117" stroke="#C6BAE6" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                        <span className="invite-envelope-seal"><Check size={24} strokeWidth={2} /></span>
                    </div>
                </div>
                <p className="invite-welcome-footer">A little more connected. A lot more possible.</p>
            </aside>

            <section className="invite-account" aria-labelledby="invite-title">
                <div className="invite-account-top">
                    <span>Already have an account?</span>
                    <Link to="/login">Sign in <ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
                <div className="invite-form-wrap">
                    <div className="invite-form-heading">
                        <h1 id="invite-title">Join your team.</h1>
                        <p>You’re invited. Create your account to get<br className="invite-desktop-break" /> started with your team on Prodly.</p>
                    </div>
                    <form ref={formRef} onSubmit={handleSubmit} className="invite-form" aria-busy={loading}>
                        {error ? <div className="invite-error-banner" role="alert">{error}</div> : null}
                        <fieldset disabled={loading}>
                            <legend className="invite-sr-only">Your account details</legend>
                            <div className="invite-fields">
                                {fields.map(({ name, label, autoComplete, placeholder, required }) => {
                                    const isPassword = name === 'password' || name === 'password2';
                                    const fieldError = errors[name];
                                    return (
                                        <div key={name} className={`invite-field${name === 'first_name' || name === 'last_name' ? '' : ' invite-field-full'}`}>
                                            <label htmlFor={`invite-${name}`}>
                                                {label}{!required ? <span className="invite-optional"> (optional)</span> : null}
                                            </label>
                                            <div className="invite-input-wrap">
                                                <input
                                                    id={`invite-${name}`}
                                                    name={name}
                                                    type={isPassword && !visiblePasswords[name] ? 'password' : 'text'}
                                                    autoComplete={autoComplete}
                                                    autoCapitalize={name === 'username' || isPassword ? 'none' : undefined}
                                                    spellCheck={name === 'username' || isPassword ? false : undefined}
                                                    value={formData[name]}
                                                    onChange={handleChange}
                                                    placeholder={placeholder}
                                                    required={required}
                                                    aria-invalid={Boolean(fieldError)}
                                                    aria-describedby={fieldError ? `invite-${name}-error` : name === 'password' ? 'invite-password-hint' : undefined}
                                                    className={isPassword ? 'invite-password-input' : undefined}
                                                />
                                                {isPassword ? (
                                                    <button
                                                        type="button"
                                                        className="invite-password-toggle"
                                                        aria-label={`${visiblePasswords[name] ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
                                                        aria-pressed={Boolean(visiblePasswords[name])}
                                                        onClick={() => setVisiblePasswords((previous) => ({ ...previous, [name]: !previous[name] }))}
                                                    >
                                                        {visiblePasswords[name] ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                                    </button>
                                                ) : null}
                                            </div>
                                            {fieldError ? <p className="invite-field-error" id={`invite-${name}-error`} role="alert">{fieldError}</p> : null}
                                            {name === 'password' ? <p className="invite-field-hint" id="invite-password-hint">Use a unique password you don’t use elsewhere.</p> : null}
                                        </div>
                                    );
                                })}
                            </div>
                            <button type="submit" className="invite-submit" disabled={loading}>
                                {loading ? <><LoaderCircle className="invite-spinner" size={18} aria-hidden="true" /> Creating your account…</> : <>Create account &amp; join <ArrowRight size={18} aria-hidden="true" /></>}
                            </button>
                        </fieldset>
                        <p className="invite-next-step" role="status">{loading ? 'Accepting your invitation. Please wait.' : 'Once your account is ready, you’ll sign in to your workspace.'}</p>
                    </form>
                </div>
                <footer className="invite-account-footer">Projects move forward. Together.</footer>
            </section>
        </main>
    );
};
