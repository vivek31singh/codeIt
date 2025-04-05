# Python3 code to demonstrate working of 
# Element Index in Range Tuples
# Using loop

# initializing list
test_list = [(0, 10), (11, 20), (21, 30), (31, 40), (41, 50)]

# printing original list
print("The original list is : " + str(test_list))

# initializing Element
K = 37

# Element Index in Range Tuples
# Using loop
res = None
for idx, ele in enumerate(test_list):
	if K >= ele[0] and K <= ele[1]:
		res = idx
		
# printing result 
print("The position of element : " + str(res)) 
