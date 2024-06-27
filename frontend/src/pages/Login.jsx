import { useState, useEffect } from 'react';
import { login } from './util/login'

import Header from '../components/Header'
import Footer from '../components/Footer'

import './stylesheets/Login.css'


function Login() {
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");


    function handleInputChange(event) {
        if (event.target.id === "user-field") {
            setUser(event.target.value);
        }
        else if (event.target.id === "password-field") {
            setPassword(event.target.value);
        }
    }

    return (
        <>
            <section className='login'>
                <div className='login-section'>
                    <h2>Username or Email</h2>
                    <input id='user-field' className='input' value={user} onChange={handleInputChange} autoFocus={true}></input>
                </div>
                <div className='login-section'>
                    <h2>Password</h2>
                    <input id='password-field' className='input' value={password} onChange={handleInputChange}></input>
                </div>
                <button onClick={(user, password) => login}>Submit</button>
            </section>
        </>
    )
}

export default Login;
