from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import boto3
import os
from datetime import datetime
from boto3.dynamodb.conditions import Key

# Initialize FastAPI app
app = FastAPI(title="SpaceKo Resource Management API", description="API for managing campus resources and spaces")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AWS Configuration
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", "spaceko-resources")
S3_BUCKET = os.getenv("S3_BUCKET", "spaceko-bucket")

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(DYNAMODB_TABLE)

# Pydantic models
class ResourceCreate(BaseModel):
    name: str
    type: str
    category: str
    wing: Optional[str] = None
    floor: Optional[int] = None
    room: Optional[str] = None
    status: str
    updatedBy: str
    ownedBy: Optional[str] = None
    stallNumber: Optional[int] = None

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    wing: Optional[str] = None
    floor: Optional[int] = None
    room: Optional[str] = None
    status: Optional[str] = None
    updatedBy: Optional[str] = None
    ownedBy: Optional[str] = None
    stallNumber: Optional[int] = None

class Resource(BaseModel):
    id: int
    name: str
    type: str
    category: str
    wing: Optional[str] = None
    floor: Optional[int] = None
    room: Optional[str] = None
    status: str
    lastUpdated: str
    updatedBy: Optional[str] = None
    verifiedBy: Optional[str] = None
    verifiedAt: Optional[str] = None
    ownedBy: Optional[str] = None
    stallNumber: Optional[int] = None

class VerificationRequest(BaseModel):
    verifiedBy: str

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "spaceko-resource-api"}

@app.get("/")
async def root():
    return {"message": "SpaceKo Resource Management API is running"}

# Create a new resource
@app.post("/resources", response_model=Resource)
async def create_resource(resource: ResourceCreate):
    timestamp = datetime.utcnow().isoformat()
    
    # Generate a unique ID (in a real app, you'd use auto-increment)
    import random
    resource_id = random.randint(1000, 9999)
    
    item = {
        'id': resource_id,
        'name': resource.name,
        'type': resource.type,
        'category': resource.category,
        'wing': resource.wing,
        'floor': resource.floor,
        'room': resource.room,
        'status': resource.status,
        'lastUpdated': timestamp,
        'updatedBy': resource.updatedBy,
        'verifiedBy': None,
        'verifiedAt': None,
        'ownedBy': resource.ownedBy,
        'stallNumber': resource.stallNumber
    }
    
    try:
        table.put_item(Item=item)
        return Resource(**item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create resource: {str(e)}")

# Get all resources
@app.get("/resources", response_model=List[Resource])
async def get_all_resources():
    try:
        response = table.scan()
        resources = []
        for item in response['Items']:
            resources.append(Resource(**item))
        return resources
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch resources: {str(e)}")

# Get resource by ID
@app.get("/resources/{resource_id}", response_model=Resource)
async def get_resource(resource_id: int):
    try:
        response = table.get_item(Key={'id': resource_id})
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        return Resource(**response['Item'])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch resource: {str(e)}")

# Update resource
@app.put("/resources/{resource_id}", response_model=Resource)
async def update_resource(resource_id: int, resource_update: ResourceUpdate):
    try:
        # Check if resource exists
        response = table.get_item(Key={'id': resource_id})
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        # Prepare update expression
        update_expression = "SET lastUpdated = :lastUpdated"
        expression_values = {':lastUpdated': datetime.utcnow().isoformat()}
        
        if resource_update.name is not None:
            update_expression += ", name = :name"
            expression_values[':name'] = resource_update.name
            
        if resource_update.type is not None:
            update_expression += ", #type = :type"
            expression_values[':type'] = resource_update.type
            
        if resource_update.category is not None:
            update_expression += ", category = :category"
            expression_values[':category'] = resource_update.category
            
        if resource_update.wing is not None:
            update_expression += ", wing = :wing"
            expression_values[':wing'] = resource_update.wing
            
        if resource_update.floor is not None:
            update_expression += ", floor = :floor"
            expression_values[':floor'] = resource_update.floor
            
        if resource_update.room is not None:
            update_expression += ", room = :room"
            expression_values[':room'] = resource_update.room
            
        if resource_update.status is not None:
            update_expression += ", status = :status"
            expression_values[':status'] = resource_update.status
            
        if resource_update.updatedBy is not None:
            update_expression += ", updatedBy = :updatedBy"
            expression_values[':updatedBy'] = resource_update.updatedBy
            
        if resource_update.ownedBy is not None:
            update_expression += ", ownedBy = :ownedBy"
            expression_values[':ownedBy'] = resource_update.ownedBy
            
        if resource_update.stallNumber is not None:
            update_expression += ", stallNumber = :stallNumber"
            expression_values[':stallNumber'] = resource_update.stallNumber
        
        # Update the item
        table.update_item(
            Key={'id': resource_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ExpressionAttributeNames={'#type': 'type'} if resource_update.type else {}
        )
        
        # Return updated resource
        updated_response = table.get_item(Key={'id': resource_id})
        return Resource(**updated_response['Item'])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update resource: {str(e)}")

# Delete resource
@app.delete("/resources/{resource_id}")
async def delete_resource(resource_id: int):
    try:
        # Check if resource exists
        response = table.get_item(Key={'id': resource_id})
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        # Delete resource from DynamoDB
        table.delete_item(Key={'id': resource_id})
        
        return {"message": "Resource deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete resource: {str(e)}")

# Get resources by status
@app.get("/resources/status/{status}")
async def get_resources_by_status(status: str):
    try:
        response = table.scan(
            FilterExpression=Key('status').eq(status)
        )
        resources = []
        for item in response['Items']:
            resources.append(Resource(**item))
        return resources
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch resources by status: {str(e)}")

# Get resources by type
@app.get("/resources/type/{type}")
async def get_resources_by_type(type: str):
    try:
        response = table.scan(
            FilterExpression=Key('type').eq(type)
        )
        resources = []
        for item in response['Items']:
            resources.append(Resource(**item))
        return resources
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch resources by type: {str(e)}")

# Get resources by category
@app.get("/resources/category/{category}")
async def get_resources_by_category(category: str):
    try:
        response = table.scan(
            FilterExpression=Key('category').eq(category)
        )
        resources = []
        for item in response['Items']:
            resources.append(Resource(**item))
        return resources
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch resources by category: {str(e)}")

# Verify resource
@app.patch("/resources/{resource_id}/verify")
async def verify_resource(resource_id: int, verification: VerificationRequest):
    try:
        # Check if resource exists
        response = table.get_item(Key={'id': resource_id})
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        # Update verification
        table.update_item(
            Key={'id': resource_id},
            UpdateExpression="SET verifiedBy = :verifiedBy, verifiedAt = :verifiedAt",
            ExpressionAttributeValues={
                ':verifiedBy': verification.verifiedBy,
                ':verifiedAt': datetime.utcnow().isoformat()
            }
        )
        
        # Return updated resource
        updated_response = table.get_item(Key={'id': resource_id})
        return Resource(**updated_response['Item'])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify resource: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
