from huggingface_hub import InferenceClient
import os
api_key = os.getenv("HF_API_KEY")


client = InferenceClient(
    provider="novita",
    api_key=api_key,
)


completion = client.chat.completions.create(
    model="mistralai/Mistral-7B-Instruct-v0.3",
    messages=[
        {
            "role": "user",
            "content": "من اكتشف الجاذبية"
        }
    ],
    max_tokens=512,
)

print(completion.choices[0].message.content)
