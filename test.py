# Importing the required libraries
import numpy as np
import pandas as pd
from apyori import apriori

# Loading the dataset
store_data = pd.read_csv('Day1.csv', header=None)

# Viewing the dataset
print(store_data)

# Checking the shape of the dataset (rows, columns)
print("Dataset Shape:", store_data.shape)

# Converting the pandas DataFrame into a list of lists
records = []
for i in range(0, store_data.shape[0]):  # Loop through all rows
    records.append([str(store_data.values[i, j]) for j in range(0, store_data.shape[1])])

# Applying the Apriori algorithm
association_rules = apriori(records, min_support=0.50, min_confidence=0.7, min_lift=1.2, min_length=2)
association_results = list(association_rules)

# Getting the number of rules found
print("Number of Association Rules:", len(association_results))

# Displaying the association rules
for rule in association_results:
    items = [x for x in rule.items]
    print(f"Rule: {items} -> Support: {rule.support}")

    for result in rule.ordered_statistics:
        print(f"   Confidence: {result.confidence}, Lift: {result.lift}")
    print("-" * 40)
