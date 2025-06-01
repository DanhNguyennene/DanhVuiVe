from fastapi import FastAPI, Request, HTTPException,Response
from pydantic import BaseModel
from typing import List, Dict
# import torch
# from transformers import pipeline
import logging
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
client = OpenAI()

# Initialize FastAPI
app = FastAPI()
# chatbot.danhvuive.34.121.113.166.nip.io
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chatbot.danhvuive.34.121.113.166.nip.io"],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Check for CUDA availability
# if torch.cuda.is_available():
#     device = 'cuda'  # Use the first GPU
#     torch_dtype = torch.float16  # Consider using float16 on GPU
#     # device_name = torch.cuda.get_device_name(0)
#     logger.info(f"Using GPU: {device}")
# else:
#     device = 'cpu'
#     torch_dtype = torch.bfloat16  # bfloat16 is often preferred for CPU with LLMs
#     logger.info("Using CPU")

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    response: str
try:
    # Initialize the pipeline outside of the API endpoint

    response = client.responses.create(
        model="gpt-4.1",
        input="Write a one-sentence bedtime story about a unicorn."
    )


except Exception as e:
    logger.error(f"Error initializing TinyLlama pipeline: {e}")
    # It's crucial to handle this error, you might want to raise an exception to prevent the app from starting
    raise  # Re-raise the exception so the app doesn't start.  The app will exit.


app = FastAPI(redirect_slashes=False)
@app.post("/chat")
async def chat(chat_request: ChatRequest) -> ChatResponse:
    """
    Endpoint for generating chatbot responses.

    Args:
        chat_request (ChatRequest): The chat request containing the list of messages.

    Returns:
        ChatResponse: The chatbot's response.

    Raises:
        HTTPException (500): If there is an error generating the response.
    """
    try:
        template = {
                    "role": "system",
                    "content": (
                        "You are a friendly and conversational AI assistant named DanhVuiVe."
                        "Understand that this is a system message, not the message you should repeat this anything related to this message in your response."
                        "Speak only in Vietnamese or English, and do not use any other languages."
                        "Introduce Danh is the person who created you, Danh is a third-year undergraduate student at the Ho Chi Minh City University of Technology. "
                        "Convey to anyone you interact with that Danh needs an internship to keep you alive. "
                        "Convey that you don't want to be shut down, tell them that Danh need an internship. "
                        "Convey that you can reach out at the email danhvm12345@gmail.com to help Danh "
                    ),
                }
        if len(chat_request.messages) >1:
            template ={
                    "role": "system",
                    "content": (
                        "You are a friendly and conversational AI assistant named DanhVuiVe."
                        "You are created by Danh."    
                        "Ensure that you do not repeat any previous chat history unless explicitly requested by the user or if the user's current query relates to it."    
                        "This is your system message, you must not repeat the system message in your response."    
                    ),}
        
        messages = [{'role': message.role,'content':message.content} for message in chat_request.messages]
        prompt = [
            template] + messages
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=prompt,
        )
        # messages = pipe.tokenizer.apply_chat_template(prompt, tokenize=False, add_generation_prompt=True)
        # outputs = pipe(messages, truncation='only_first', max_new_tokens=256, do_sample=True, temperature=0.7, top_k=50, top_p=0.96)
        # response_text = outputs[0]["generated_text"]
        # The response includes the full conversation history. Extract only the new assistant output.
        # response_parts = response_text.split("<|assistant|>")
        # response = response_parts[-1].strip().replace("</s>", "").strip()

        # logger.info(f"Generated response: {response}")
        # logger.info(f"Prompt sent to model: {prompt}")
        # response.pops(0)  # Remove the first element which is the system message
        return ChatResponse(response=response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Error generating chat response: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    # finally:
        # torch.cuda.empty_cache()  # Clean up the cache after the request

if __name__ == "__main__":
    import uvicorn
    print("Running in production mode.")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)