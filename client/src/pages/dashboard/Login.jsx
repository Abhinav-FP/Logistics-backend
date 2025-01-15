import React from 'react'

export default function Login() {
  return (
    <>
      <div className='h-[100vh] flex '>
        <img src="/assets/images/login-image.png" alt="img" className='w-[60%] object-cover h-full ' />
        <div className='w-[40%] flex flex-col items-center justify-center'>
          <div className='max-w-[420px] mx-auto'>
            <h3 className='text-[22px] leading-[26px] font-[600] tracking-[-0.03em] text-[#262626] uppercase mb-1'>Sign In</h3>
            <p className='text-[16px] leading-[19px] tracking-[-0.03em] text-[#727272] font-[400]'>Welcome to logistics supply chain platform Register as a member to experience</p>
            <form className='space-y-[20px] mt-[30px]'>
              <div>
                <label htmlFor="email" className='block text-[16px] leading-[19px] tracking-[-0.03em] text-[#727272] font-[400] mb-1'>Email</label>
                <input type="email" name="email" id="email" className='w-full outline-none p-[10px] text-[16px] leading-[19px] tracking-[-0.03em] text-[#727272] font-[400] bg-[#F4F6F8] border-none rounded-[15px] h-[65px]' />
              </div>
              <div>
                <label htmlFor="password" className='block text-[16px] leading-[19px] tracking-[-0.03em] text-[#727272] font-[400] mb-1'>Password</label>
                <input type="password" name="password" id="password" className='w-full outline-none p-[10px] text-[16px] leading-[19px] tracking-[-0.03em] text-[#727272] font-[400] bg-[#F4F6F8] border-none rounded-[15px] h-[65px]' />
                <div className='text-end mt-1'>
                  <a href="#" className='text-[18px] leading-[21px] font-[500] tracking-[-0.04em] text-[#1C5FE8]'>Forget Password?</a>
                </div>
              </div>
              <div>
                <button type="submit" className='w-full p-[15px] font-[Poppins] text-[16px] leading-[24px] font-[500] text-[#ffffff] bg-[#1C5FE8] rounded-[10px] uppercase'>Sign In</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
