import './stylesheets/Login.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

function Login() {
    return (
        <>
            <section className='login'>
                <div className='login-section'>
                    <h2>Username or Email</h2>
                    <input className='input'></input>
                </div>
                <div className='login-section'>
                    <h2>Password</h2>
                    <input className='input'></input>
                </div>
            </section>
        </>
    )
}

export default Login;
