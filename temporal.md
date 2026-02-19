Ok, now I want to start building the actual chatbot in the Lambda.

As a first step we are going to make the ability to call the LLM api.

I want to apply all the best code quality standards. I want to use pydantic

I want to have the following objects:
- Prompt object -> This object should have two atributes: System prompt, user prompt. We also need to have two methods to format each of this prompts. Then, we should have a method to convert to a messages list just like the openai api expects (a list of dicts).

- LLMModel -> This defines an LLM model. Its abstract.
    Atributes:
	* model_name
	* reasoning_effort
	* temperature
	* top_p
	* top_k
  As methods, the object should have:
	* call -> This calls the model's API, it should receive a generic value and return the same generic value type.
        Parameters:
		* prompt: A prompt object
		* structured_output (optional): the structured output we expect

        Returns:
        * The structured output response. A string in case no structure output was given
        
- Childs of the LLM model object -> This are going to be the actual objects we call at runtime. Examples are: `OpenAIModel`, `GeminiModel`, `AntropicModel`. For now, implement the `OpenAIModel` object using the openAI sdk (you have to install it using uv).

- PortfolioChatbot -> This is going to be the actual object that runs the lambda.
    Attributes:
    * llm_models -> A list of LLMModel objects. This way in case one fails we go to the other object.
    * prompt -> A prompt object that is the prompt that we pass to all LLMs

    It should have the following methods:
    * execute -> Executes the whole pipeline. Empty for now
    * _get_response(messages: list[str]): this function gets a list of strings, formats the user prompt (for now a simple `{ messages: messages }`), and tries to call the LLMs. If one fails, it goes to the next one, the first successfull message is returned. In case all LLMs fail, throw an error.



This is the first thing we are going to do, we will then iterate into something more complex
