#!/bin/bash


for i in $(seq 1 3); do
    echo $i: \
        j\'ecris

    echo "{
    bonjour $i
}" > test1.file

    echo j\'affiche
    cat test1.file
done
