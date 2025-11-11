import { auth, currentUser } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import React from 'react'

async function page() {
  const { userId } = await auth()
  if (!userId) {
    return redirect('/')
  }

  const user = await currentUser()
  if (!user) {
    return notFound()
  }

  if(!user.emailAddresses[0]?.emailAddress) {
    return notFound()
  }

  await prisma.user.upsert({
    where: {
      emailAddress: user.emailAddresses[0]?.emailAddress ?? "",
    },
    update: {
      imageUrl: user.imageUrl,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    create: {
      id: userId,
      emailAddress: user.emailAddresses[0]?.emailAddress ?? "",
      imageUrl: user.imageUrl,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  })

  return redirect('/dashboard')
}

export default page