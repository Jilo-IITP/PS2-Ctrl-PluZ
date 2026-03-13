from get_chunks import StandaloneRetriever

retriever = StandaloneRetriever()
my_chunks = retriever.search("for Pneumonia due to staphylococcus?")
# my_chunks = retriever.search("for Pneumonia due to staphylococcus and for Anesthesia of skin?")

print("="*100)
print(my_chunks[0])
print("="*100, "\n")

# for chunk in my_chunks:
#     print("="*100)
#     print(chunk)
#     print("="*100, "\n")
    