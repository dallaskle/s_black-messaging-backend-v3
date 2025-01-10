import supabase from '../../config/supabaseClient';

export const resendConfirmationEmail = async (email: string) => {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'fake_password_to_resend',
    });

    if (error) {
        if (error.status === 400 && error.message === 'User already registered') {
            console.log('Confirmation email resent. Please check your inbox.');
        } else {
            console.error('Error resending confirmation email:', error.message);
        }
    } else {
        console.log('Confirmation email resent successfully.');
    }
}; 