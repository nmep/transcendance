import random
from datetime import datetime


NB_INDIVIDU = 50
SELECTION_RATE = 0.5
TIME_TO_ANSWER = 500 #en ms

class Indiv:
    def __init__(self, idx):
        self.rank = idx
        self.genesX = [random.choice([-1, 0, 1]) for _ in range(30)]
        self.genesZ = [random.choice([-1, 0, 1]) for _ in range(30)]

    def maj_genes(self):
        self.genesX = self.genesX[1:] + random.choice([-1, 0, 1])
        self.genesX = self.genesZ[1:] + random.choice([-1, 0, 1])


def ft_create_pop(population):
    for i in range(NB_INDIVIDU):
        population.append(Indiv(i))

def ft_maj_pop(population):
    for indiv in population:
        indiv.maj_genes()

def ft_generation(population, deadline):
    ft_simulation()
    ft_rank()
    ft_reproduction_mutation()

    if datetime.now() < deadline:
        ft_generation(population, deadline)

def main(population, deadline):
    if len(population) == 0:
        ft_create_pop(population)
    else:
        ft_maj_pop(population)

    ft_generation(population, deadline)






#main execution
population = []
main(population, datetime.now() + TIME_TO_ANSWER)