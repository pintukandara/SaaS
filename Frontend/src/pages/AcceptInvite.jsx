import React from 'react'
import { useState } from 'react';
import api from '../api/axios';
import { useParams } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';
export const AcceptInvite = () => {
    const {token} = useParams();
    const [formData, setFormData] = useState({
  "username": "",
  "password": "",
  "password2": "",
  "first_name": "",
  "last_name": "",
  "token":token
 
});
    const navigate = useNavigate();
    

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await api.post('/auth/accept-invitation/',formData);
            console.log(response);
            navigate('/login')


        }catch (err) {
            console.log(err.response)
        }
    }

  return (
    <>
       <div> <h1 className=''>Fill out your details below to get started...</h1></div>
        <form onSubmit={handleSubmit}>
            <div>
                <label>username</label>
                <input 
                type="text" 
                name='username'
                value={formData.username}
                onChange={handleChange}
                placeholder='Enter you name'

                 />
            </div>
            <br />
            <div>
                <label>first Name</label>
                <input 
                type="text" 
                name='first_name'
                onChange={handleChange}
                value={formData.first_name}
                
                 />
            </div>
            <br />
            <div>
                <label>Last Name</label>
                <input 
                type="text" 
                name='last_name'
                onChange={handleChange}
                value={formData.last_name}
                
                 />
            </div>
            <br />
            <div>
                <label>Password</label>
                <input 
                type="password" 
                name='password'
                onChange={handleChange}
                value={formData.password}
                
                 />
            </div>
            <br />
            <div>
                <label>Confirm Password</label>
                <input 
                type="password" 
                name='password2'
                onChange={handleChange}
                value={formData.password2}
                
                 />
            </div>
            <br />

            <div>
                <button
                type='submit'

                >Submit</button>
            </div>
        </form>

    </>
  )
}
