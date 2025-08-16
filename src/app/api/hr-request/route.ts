import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { zenhrAPI } from '@/lib/zenhr'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      type, 
      title, 
      description, 
      startDate, 
      endDate, 
      priority = 'MEDIUM',
      documents 
    } = body

    if (!type || !title || !description) {
      return NextResponse.json(
        { error: 'Type, title, and description are required' }, 
        { status: 400 }
      )
    }

    // Submit request to ZenHR
    const zenhrResponse = await zenhrAPI.submitHRRequest({
      employeeId: session.user.employeeId,
      type,
      title,
      description,
      startDate,
      endDate
    })

    // Find manager for approval workflow
    const employee = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true }
    })

    // Find a manager in the same company (simplified logic)
    const manager = await prisma.user.findFirst({
      where: {
        companyId: employee?.companyId,
        role: 'MANAGER'
      }
    })

    // Create HR request in local database
    const hrRequest = await prisma.hRRequest.create({
      data: {
        type: type.toUpperCase(),
        title,
        description,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        documents: documents ? JSON.stringify(documents) : null,
        employeeId: session.user.id,
        managerId: manager?.id,
        companyId: session.user.companyId
      },
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            employeeId: true
          }
        },
        manager: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Create notification for manager
    if (manager) {
      await prisma.notification.create({
        data: {
          title: 'New HR Request',
          message: `${session.user.name} has submitted a ${type} request: ${title}`,
          type: 'HR_REQUEST',
          userId: manager.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'HR request submitted successfully',
      data: {
        hrRequest,
        zenhrResponse
      }
    })

  } catch (error) {
    console.error('HR Request API error:', error)
    return NextResponse.json(
      { error: 'Failed to submit HR request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const employeeId = searchParams.get('employeeId')

    let whereClause: any = {}

    // Role-based filtering
    if (session.user.role === 'EMPLOYEE') {
      whereClause.employeeId = session.user.id
    } else if (session.user.role === 'MANAGER') {
      if (employeeId) {
        whereClause.employeeId = employeeId
      } else {
        whereClause.OR = [
          { employeeId: session.user.id },
          { managerId: session.user.id }
        ]
      }
    } else if (session.user.role === 'ADMIN') {
      whereClause.companyId = session.user.companyId
      if (employeeId) {
        whereClause.employeeId = employeeId
      }
    }

    // Additional filters
    if (status) {
      whereClause.status = status.toUpperCase()
    }
    if (type) {
      whereClause.type = type.toUpperCase()
    }

    const hrRequests = await prisma.hRRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            employeeId: true,
            department: true
          }
        },
        manager: {
          select: {
            name: true,
            email: true
          }
        },
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: hrRequests
    })

  } catch (error) {
    console.error('HR Request fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch HR requests' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user || (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requestId, status, comments } = body

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' }, 
        { status: 400 }
      )
    }

    // Update request status
    const updatedRequest = await prisma.hRRequest.update({
      where: { id: requestId },
      data: { 
        status: status.toUpperCase(),
        comments 
      },
      include: {
        employee: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Create approval record
    await prisma.requestApproval.create({
      data: {
        requestId,
        approverId: session.user.id,
        status: status.toUpperCase(),
        comments
      }
    })

    // Update status in ZenHR
    await zenhrAPI.updateHRRequestStatus(requestId, status, comments)

    // Create notification for employee
    await prisma.notification.create({
      data: {
        title: 'HR Request Update',
        message: `Your ${updatedRequest.type} request has been ${status.toLowerCase()}`,
        type: 'HR_REQUEST',
        userId: updatedRequest.employeeId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'HR request status updated successfully',
      data: updatedRequest
    })

  } catch (error) {
    console.error('HR Request update error:', error)
    return NextResponse.json(
      { error: 'Failed to update HR request' },
      { status: 500 }
    )
  }
}
